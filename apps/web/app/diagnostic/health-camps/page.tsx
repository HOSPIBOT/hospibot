'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "health-camps",
  "title": "Health Camps",
  "subtitle": "Venue \u00b7 Test Menu \u00b7 Staffing \u00b7 Registration",
  "apiPath": "/diagnostic/health-camps",
  "regulations": [
    {
      "body": "MoLE",
      "citation": "Factories Act 1948, Forms 32/33",
      "requirement": "On-site/off-site camp planning. Staffing roster. Registration vs completion tracking."
    }
  ],
  "columns": [
    {
      "key": "campDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "campName",
      "label": "Camp"
    },
    {
      "key": "corporateClient",
      "label": "Client"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "campName",
      "label": "Camp Name",
      "type": "text",
      "required": true
    },
    {
      "key": "campDate",
      "label": "Camp Date",
      "type": "date",
      "required": true
    },
    {
      "key": "campType",
      "label": "Type",
      "type": "select",
      "options": [
        "corporate",
        "community",
        "government",
        "school"
      ]
    },
    {
      "key": "venue",
      "label": "Venue",
      "type": "text"
    },
    {
      "key": "expectedParticipants",
      "label": "Expected Participants",
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
