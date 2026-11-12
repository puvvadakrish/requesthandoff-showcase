-- HVAC scaffold (per plan D14).
-- Inherits General Local Business + Life-Safety Baseline (parent_id chain).
-- Adds HVAC-specific emergency urgency rules + qualification fields.

insert into vertical_scaffolds (id, vertical, name, parent_id, greeting_prefix, urgency_rules, qualification_fields, recommended_actions)
values (
  '22222222-2222-2222-2222-222222222222',
  'hvac',
  'HVAC',
  '11111111-1111-1111-1111-111111111111', -- inherits General + Life-Safety
  'Hi, this is {{business_name}}, your HVAC team.',

  -- HVAC-specific urgency rules (Life-Safety Baseline auto-merged from parent at runtime)
  $jsonb${
    "rules": [
      {"phrase": "no cooling vulnerable occupant", "severity": "urgent", "is_life_safety": false,
       "description": "AC failure with vulnerable occupant (infant, elderly, medical condition) — Austin summer heat risk."},
      {"phrase": "no heat freeze conditions", "severity": "urgent", "is_life_safety": false,
       "description": "Heating failure during freeze conditions — Texas freeze risk (per 2021 + 2024 events)."},
      {"phrase": "system completely down", "severity": "urgent", "is_life_safety": false,
       "description": "HVAC system entirely non-functional, indoor temp at risk."},
      {"phrase": "warm air from vents", "severity": "elevated", "is_life_safety": false,
       "description": "AC running but blowing warm air — partial failure."},
      {"phrase": "AC making loud noise", "severity": "elevated", "is_life_safety": false,
       "description": "Unusual mechanical noise from AC unit."},
      {"phrase": "frozen coil", "severity": "elevated", "is_life_safety": false,
       "description": "Visible frost/ice on AC coil — needs same-day attention."}
    ]
  }$jsonb$::jsonb -> 'rules',

  -- HVAC-specific qualification (merged with General intake at runtime)
  $jsonb${
    "fields": [
      {"key": "indoor_temperature", "prompt": "Do you know the current indoor temperature?", "required": false, "type": "string"},
      {"key": "system_type", "prompt": "Is this a central AC, mini-split, or window unit?", "required": false, "type": "enum", "enum_values": ["central_ac", "mini_split", "window_unit", "unknown"]},
      {"key": "system_age_years", "prompt": "How old is the system, roughly?", "required": false, "type": "string"},
      {"key": "vulnerable_occupant", "prompt": "Are there any infants, elderly residents, or anyone with a medical condition who might be affected by the temperature?", "required": false, "type": "boolean"}
    ]
  }$jsonb$::jsonb -> 'fields',

  -- HVAC recommended actions (merged with General at runtime)
  $jsonb${
    "actions": [
      {"id": "dispatch_today", "condition": "urgency_level == 'urgent' && hours.now == 'open'", "action": "dispatch_technician_today"},
      {"id": "after_hours_escalate", "condition": "urgency_level == 'urgent' && hours.now == 'closed'", "action": "warm_transfer_to_owner"},
      {"id": "schedule_priority", "condition": "urgency_level == 'elevated'", "action": "schedule_next_available_priority_slot"},
      {"id": "schedule_routine", "condition": "urgency_level == 'standard'", "action": "schedule_next_available_routine_slot"}
    ]
  }$jsonb$::jsonb -> 'actions'
);
