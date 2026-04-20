'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "franchise-labs",
  "title": "Franchise Labs",
  "subtitle": "DLPL Model \u00b7 Revenue Sharing \u00b7 Brand Compliance \u00b7 Onboarding",
  "apiPath": "/diagnostic/franchise-labs",
  "regulations": [
    {
      "body": "Industry",
      "citation": "DLPL/Metropolis Franchise Model",
      "requirement": "Revenue sharing 25-30%. Brand compliance scoring. Onboarding stages."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "franchiseName",
      "label": "Franchise"
    },
    {
      "key": "franchiseType",
      "label": "Type"
    },
    {
      "key": "onboardingStage",
      "label": "Stage"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "franchiseName",
      "label": "Franchise Name",
      "type": "text",
      "required": true
    },
    {
      "key": "franchiseType",
      "label": "Type",
      "type": "select",
      "required": true,
      "options": [
        "collection-center",
        "diagnostic-center",
        "pickup-point"
      ]
    },
    {
      "key": "ownerName",
      "label": "Owner Name",
      "type": "text"
    },
    {
      "key": "city",
      "label": "City",
      "type": "text"
    },
    {
      "key": "revSharePct",
      "label": "Rev Share %",
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
