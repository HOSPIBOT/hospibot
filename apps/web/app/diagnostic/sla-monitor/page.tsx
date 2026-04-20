'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "sla-monitor",
  "title": "SLA Monitor",
  "subtitle": "STAT 30min \u00b7 Priority 3hr \u00b7 Routine 8hr \u00b7 Breach Detection",
  "apiPath": "/diagnostic/sla-monitor",
  "regulations": [
    {
      "body": "NABL",
      "citation": "ISO 15189:2022 \u00a77.4",
      "requirement": "Auto TAT breach detection. STAT: 30min, Priority: 3hr, Routine: 8hr. Compliance rate tracking."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "studyType",
      "label": "Study"
    },
    {
      "key": "tatMinutes",
      "label": "TAT (min)"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "studyType",
      "label": "Study Type",
      "type": "text",
      "required": true
    },
    {
      "key": "priority",
      "label": "Priority",
      "type": "select",
      "options": [
        "STAT",
        "Priority",
        "Routine"
      ],
      "required": true
    },
    {
      "key": "tatMinutes",
      "label": "TAT (minutes)",
      "type": "number"
    },
    {
      "key": "notes",
      "label": "Notes",
      "type": "textarea",
      "span": 2
    }
  ]
};

export default function Page() {{
  return <FeatureCrudPage config={{config}} />;
}}
