'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "hub-spoke",
  "title": "Hub-Spoke Network",
  "subtitle": "Test Routing \u00b7 Capacity \u00b7 TAT Optimization \u00b7 NABL Multi-Location",
  "apiPath": "/diagnostic/hub-spoke",
  "regulations": [
    {
      "body": "NABL",
      "citation": "Multi-Location Accreditation",
      "requirement": "Single NABL cert with annexure. Test routing rules. Capacity planning."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "nodeName",
      "label": "Node"
    },
    {
      "key": "nodeType",
      "label": "Type"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "nodeName",
      "label": "Node Name",
      "type": "text",
      "required": true
    },
    {
      "key": "nodeType",
      "label": "Type",
      "type": "select",
      "required": true,
      "options": [
        "hub",
        "spoke",
        "collection-center",
        "pickup-point"
      ]
    },
    {
      "key": "city",
      "label": "City",
      "type": "text"
    },
    {
      "key": "dailyCapacity",
      "label": "Daily Capacity",
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
