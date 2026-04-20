'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "field-agents",
  "title": "Field Agents",
  "subtitle": "Phlebotomist Tracking \u00b7 GPS \u00b7 DMLT Cert \u00b7 Cold Box",
  "apiPath": "/diagnostic/field-agents",
  "regulations": [
    {
      "body": "TRAI",
      "citation": "Phlebotomist ID Compliance",
      "requirement": "DMLT certification. GPS tracking. Cold box assignment. Zone-based routing."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "agentName",
      "label": "Agent"
    },
    {
      "key": "zone",
      "label": "Zone"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "agentName",
      "label": "Agent Name",
      "type": "text",
      "required": true
    },
    {
      "key": "agentPhone",
      "label": "Phone",
      "type": "text",
      "required": true
    },
    {
      "key": "dmltCertNo",
      "label": "DMLT Cert No",
      "type": "text"
    },
    {
      "key": "zone",
      "label": "Zone",
      "type": "text"
    },
    {
      "key": "city",
      "label": "City",
      "type": "text"
    },
    {
      "key": "coldBoxAssigned",
      "label": "Cold Box",
      "type": "checkbox"
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
