-- General Local Business scaffold (per plan D14).
--
-- This is the DEFAULT scaffold for any tenant whose vertical isn't a specialized
-- vertical with its own playbook. Suitable for: gym, salon, dentist, lawyer,
-- electrician, landscaper, pet care, property manager, etc.
--
-- Includes the LIFE-SAFETY BASELINE urgency rules (round 3 ADV-R3-3) which
-- apply to ALL scaffolds — fire/flooding/sparks/medical-emergency phrases trigger
-- escalation regardless of vertical, so a property-manager-on-General tenant
-- whose customer calls about flooding has an escalation path.

insert into vertical_scaffolds (id, vertical, name, parent_id, greeting_prefix, urgency_rules, qualification_fields, recommended_actions)
values (
  '11111111-1111-1111-1111-111111111111',
  'general',
  'General Local Business',
  null,
  'Hi, this is {{business_name}}.',

  -- urgency_rules — Life-Safety Baseline (round 3 ADV-R3-3)
  $jsonb${
    "rules": [
      {"phrase": "fire", "severity": "urgent", "is_life_safety": true,
       "description": "Caller mentions fire, smoke, or burning."},
      {"phrase": "smoke", "severity": "urgent", "is_life_safety": true,
       "description": "Caller mentions smoke."},
      {"phrase": "burning", "severity": "urgent", "is_life_safety": true,
       "description": "Something is burning."},
      {"phrase": "flooding", "severity": "urgent", "is_life_safety": true,
       "description": "Active flooding mentioned."},
      {"phrase": "water everywhere", "severity": "urgent", "is_life_safety": true,
       "description": "Active water emergency."},
      {"phrase": "burst pipe", "severity": "urgent", "is_life_safety": true,
       "description": "Burst pipe mentioned."},
      {"phrase": "sparks", "severity": "urgent", "is_life_safety": true,
       "description": "Electrical sparks observed."},
      {"phrase": "shock", "severity": "urgent", "is_life_safety": true,
       "description": "Electrical shock."},
      {"phrase": "electrical fire", "severity": "urgent", "is_life_safety": true,
       "description": "Electrical fire."},
      {"phrase": "smell of gas", "severity": "urgent", "is_life_safety": true,
       "description": "Possible gas leak."},
      {"phrase": "gas leak", "severity": "urgent", "is_life_safety": true,
       "description": "Gas leak."},
      {"phrase": "carbon monoxide", "severity": "urgent", "is_life_safety": true,
       "description": "Possible CO exposure."},
      {"phrase": "CO alarm", "severity": "urgent", "is_life_safety": true,
       "description": "CO alarm sounding."},
      {"phrase": "medical emergency", "severity": "urgent", "is_life_safety": true,
       "description": "Medical emergency stated."},
      {"phrase": "heart attack", "severity": "urgent", "is_life_safety": true,
       "description": "Heart attack."},
      {"phrase": "can't breathe", "severity": "urgent", "is_life_safety": true,
       "description": "Caller can't breathe."},
      {"phrase": "ambulance", "severity": "urgent", "is_life_safety": true,
       "description": "Ambulance needed."}
    ]
  }$jsonb$::jsonb -> 'rules',

  -- qualification_fields — minimal General intake
  $jsonb${
    "fields": [
      {"key": "caller_name", "prompt": "Could I have your name?", "required": true, "type": "string"},
      {"key": "caller_phone", "prompt": "What is the best phone number to reach you?", "required": true, "type": "string"},
      {"key": "service_category", "prompt": "What can we help you with today?", "required": true, "type": "string"},
      {"key": "preferred_window", "prompt": "When would you like us to follow up?", "required": false, "type": "string"}
    ]
  }$jsonb$::jsonb -> 'fields',

  -- recommended_actions
  $jsonb${
    "actions": [
      {"id": "callback", "condition": "default", "action": "callback_request"},
      {"id": "escalate_owner", "condition": "urgency_level == 'urgent'", "action": "warm_transfer_to_owner"}
    ]
  }$jsonb$::jsonb -> 'actions'
);
