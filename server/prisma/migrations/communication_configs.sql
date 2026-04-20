-- Communication Provider Configuration (Super Admin controlled)
-- Run in Supabase SQL Editor (Run without RLS)

CREATE TABLE IF NOT EXISTS communication_configs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  channel TEXT NOT NULL UNIQUE,  -- 'sms' | 'email' | 'whatsapp'
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  credentials JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  cost_per_unit DOUBLE PRECISION DEFAULT 0,
  sell_price_per_unit DOUBLE PRECISION DEFAULT 0,
  unit_label TEXT DEFAULT 'message',
  rate_card_json JSONB,
  fallback_provider TEXT,
  max_retries INTEGER DEFAULT 2,
  notes TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default providers
INSERT INTO communication_configs (channel, provider, display_name, credentials, settings, cost_per_unit, sell_price_per_unit, unit_label, rate_card_json)
VALUES 
  ('sms', 'msg91', 'MSG91 (India)', 
   '{"authKey":"","senderId":"HSPBOT","dltEntityId":""}'::JSONB,
   '{"templateId":"","apiUrl":"https://api.msg91.com/api/v5/flow/","countryCode":"91"}'::JSONB,
   12, 25, 'SMS',
   '[{"min":0,"max":1000,"pricePerUnit":25,"label":"Standard"},{"min":1001,"max":5000,"pricePerUnit":20,"label":"Bulk"},{"min":5001,"max":999999,"pricePerUnit":15,"label":"Enterprise"}]'::JSONB),
  ('email', 'smtp', 'SMTP (Generic)',
   '{"host":"","port":587,"user":"","pass":"","secure":false}'::JSONB,
   '{"fromName":"HospiBot","fromEmail":"","replyTo":""}'::JSONB,
   1, 5, 'email', NULL),
  ('whatsapp', 'meta_cloud_api', 'Meta Cloud API',
   '{"accessToken":"","phoneNumberId":"","businessAccountId":"","verifyToken":""}'::JSONB,
   '{"apiVersion":"v19.0","webhookUrl":"","defaultLanguage":"en"}'::JSONB,
   40, 50, 'message',
   '[{"category":"utility","pricePerUnit":35,"label":"Utility (OTP, alerts)"},{"category":"marketing","pricePerUnit":80,"label":"Marketing (promos)"},{"category":"service","pricePerUnit":0,"label":"Service (24h window)"}]'::JSONB)
ON CONFLICT (channel) DO NOTHING;
