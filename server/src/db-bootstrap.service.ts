import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * DbBootstrapService — the sole place where `prisma db push` and
 * `prisma db seed` run at app startup. Runs inside the NestJS app so it
 * works regardless of what command Railway uses to start the container.
 *
 * Design notes:
 *
 * 1. SEQUENTIAL. Push MUST fully complete before seed starts — otherwise
 *    the seed races against schema-lock migrations and fails with errors
 *    like "column X does not exist". Earlier versions of this file fired
 *    push + seed in parallel via setTimeout, which is exactly the bug we
 *    fixed here.
 *
 * 2. GENEROUS TIMEOUTS. First-time migrations against Supabase Session
 *    Pooler can take 90+ seconds for a schema with 40+ tables and many
 *    new columns. 5 minutes per step is overkill for steady-state but
 *    safe for first-deploy.
 *
 * 3. NON-BLOCKING. Uses setImmediate to return control to onModuleInit
 *    immediately. The app listens on its port while push + seed run in
 *    the background. Endpoints that depend on new tables may return 500
 *    during the bootstrap window, but /health passes, which is what
 *    Railway healthcheck cares about.
 *
 * 4. IDEMPOTENT. `prisma db push` is a no-op when schema is current;
 *    the seed uses upserts throughout. Re-running on every boot is safe.
 *
 * 5. OPT-OUT. Set SKIP_DB_BOOTSTRAP=true in Railway env once the DB is
 *    known-good to skip these steps entirely and cut ~30 s off cold
 *    starts. Individual steps can also be skipped via
 *    SKIP_DB_PUSH=true / SKIP_DB_SEED=true.
 */
@Injectable()
export class DbBootstrapService implements OnModuleInit {
  private readonly logger = new Logger('DbBootstrap');

  async onModuleInit() {
    if (process.env.SKIP_DB_BOOTSTRAP === 'true') {
      this.logger.log('SKIP_DB_BOOTSTRAP=true — skipping migration and seed');
      return;
    }

    // Run in a detached async chain so this method returns immediately and
    // the rest of the app can start listening.
    setImmediate(() => {
      this.runChain().catch((err) => {
        this.logger.error(`bootstrap chain crashed: ${err?.message ?? err}`);
      });
    });
  }

  private async runChain() {
    this.logger.log('═══ DB bootstrap chain starting ═══');

    const pushOk = await this.runStep(
      'db-push',
      'npx prisma db push --accept-data-loss --skip-generate',
      process.env.SKIP_DB_PUSH === 'true',
      5 * 60 * 1000, // 5 min
    );

    if (!pushOk) {
      this.logger.error(
        '[db-push] did not succeed — skipping seed (it would fail against a stale schema)',
      );
      return;
    }

    // Small breather so Postgres settles any post-migration housekeeping.
    await new Promise((r) => setTimeout(r, 2000));

    await this.runStep(
      'db-seed',
      'npx prisma db seed',
      process.env.SKIP_DB_SEED === 'true',
      15 * 60 * 1000, // 15 min — seed chain is large (18+10 WA templates,
                      // 41 features, 7 groups, 4 tiers, feature gates matrix).
                      // Each Prisma query is ~100-300ms over Supabase pooler,
                      // so hundreds of sequential calls need ample headroom.
    );

    this.logger.log('═══ DB bootstrap chain finished ═══');
  }

  /**
   * Run a child process with the given command. Returns true on success,
   * false on failure or if skipped. Never throws.
   */
  private async runStep(
    label: string,
    cmd: string,
    skip: boolean,
    timeoutMs: number,
  ): Promise<boolean> {
    if (skip) {
      this.logger.log(`[${label}] skipped via env var`);
      return true; // treat skip as success so the chain continues
    }

    const started = Date.now();
    this.logger.log(`[${label}] running (timeout ${timeoutMs / 1000}s): ${cmd}`);

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1',
        },
        timeout: timeoutMs,
        maxBuffer: 20 * 1024 * 1024, // 20 MB — seed output can be large
      });

      const secs = Math.round((Date.now() - started) / 1000);
      this.logger.log(`[${label}] ✅ complete in ${secs}s`);

      const lines = stdout.trim().split('\n').filter(Boolean);
      const tail = lines.slice(-6).join(' | ');
      if (tail) this.logger.log(`[${label}] output: ${tail}`);
      if (stderr && stderr.trim()) {
        this.logger.debug(`[${label}] stderr: ${stderr.trim().slice(-400)}`);
      }
      return true;
    } catch (err: any) {
      const secs = Math.round((Date.now() - started) / 1000);
      const killed = err?.killed ? ' (killed by timeout)' : '';
      this.logger.error(
        `[${label}] FAILED after ${secs}s${killed}: ${err?.message ?? err}`,
      );
      if (err?.stderr) {
        this.logger.error(
          `[${label}] stderr tail: ${String(err.stderr).slice(-800)}`,
        );
      }
      return false;
    }
  }
}
