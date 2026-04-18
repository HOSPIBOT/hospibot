import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { exec } from 'child_process';

/**
 * DbBootstrapService — runs `prisma db push` and `prisma db seed` from
 * within the NestJS app on module init, so the DB is always migrated and
 * seeded regardless of how the container was started.
 *
 * Why this exists:
 * The Dockerfile CMD contains the canonical boot sequence (db push + seed
 * + node), but Railway's dashboard-level "Custom Start Command" can silently
 * override the Dockerfile CMD. When that happens the DB migration + seed
 * steps are skipped and the app boots against an empty/missing schema.
 * Putting the same work inside onModuleInit() means it runs on every boot
 * regardless of which start command Railway uses.
 *
 * Behaviour:
 *   - Non-blocking. The app listens on its port while push + seed run in
 *     the background. Endpoints that query missing tables degrade to
 *     empty-array responses during the brief bootstrap window.
 *   - Idempotent. `prisma db push` is a no-op when schema is current;
 *     seed uses upserts. Re-running on every boot is safe.
 *   - Opt-out. Set SKIP_DB_BOOTSTRAP=true in Railway env to disable (e.g.
 *     once the Dockerfile CMD path is fixed and you want to avoid the
 *     small cold-start overhead).
 *   - Bounded. Each command has a 2-minute timeout so a hung migration
 *     cannot consume the container forever.
 */
@Injectable()
export class DbBootstrapService implements OnModuleInit {
  private readonly logger = new Logger('DbBootstrap');

  async onModuleInit() {
    if (process.env.SKIP_DB_BOOTSTRAP === 'true') {
      this.logger.log('Skipped via SKIP_DB_BOOTSTRAP=true');
      return;
    }

    // Run push immediately (async), seed a bit later to let push finish.
    this.runCommand(
      'db-push',
      'npx prisma db push --accept-data-loss --skip-generate',
      0,
    );
    this.runCommand(
      'db-seed',
      'npx prisma db seed',
      25_000, // 25s — enough for a typical db push to finish
    );
  }

  private runCommand(label: string, cmd: string, delayMs: number) {
    setTimeout(() => {
      this.logger.log(`[${label}] running: ${cmd}`);
      exec(
        cmd,
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1',
          },
          timeout: 120_000, // 2 min hard cap
          maxBuffer: 10 * 1024 * 1024, // 10 MB — seed output can be verbose
        },
        (err, stdout, stderr) => {
          if (err) {
            this.logger.error(
              `[${label}] FAILED (exitCode=${err.code ?? 'n/a'}): ${err.message}`,
            );
            if (stderr) {
              // Log only the tail of stderr to avoid spamming log when
              // prisma prints long stack traces.
              this.logger.error(
                `[${label}] stderr tail: ${stderr.slice(-800)}`,
              );
            }
            return;
          }
          this.logger.log(`[${label}] ✅ complete`);
          // Show the last line of stdout (e.g. "✅ 34 diagnostic subtypes seeded")
          const lines = stdout.trim().split('\n').filter(Boolean);
          const lastFew = lines.slice(-5).join(' | ');
          if (lastFew) this.logger.log(`[${label}] output: ${lastFew}`);
        },
      );
    }, delayMs);
  }
}
