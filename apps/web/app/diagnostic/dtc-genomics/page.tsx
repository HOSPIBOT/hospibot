'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "dtc-genomics",
  "title": "DTC Preventive Genomics",
  "subtitle": "Consumer Genetic Testing \u00b7 Ancestry \u00b7 Wellness \u00b7 Pharmacogenomics",
  "apiPath": "/diagnostic/dtc-genomics",
  "regulations": [
    {
      "body": "MeitY",
      "citation": "DPDPA 2023 (Genetic Data is Sensitive)",
      "requirement": "Explicit consent for genetic data processing. No diagnostic claims without clinical validation. Genetic counselor availability."
    }
  ],
  "columns": [
    {
      "key": "orderDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "consumerName",
      "label": "Consumer"
    },
    {
      "key": "testPanel",
      "label": "Panel"
    },
    {
      "key": "kitId",
      "label": "Kit ID"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "consumerName",
      "label": "Consumer Name",
      "type": "text",
      "required": true
    },
    {
      "key": "consumerPhone",
      "label": "Phone",
      "type": "text",
      "required": true
    },
    {
      "key": "testPanel",
      "label": "Panel",
      "type": "select",
      "options": [
        "ancestry",
        "wellness",
        "nutrigenomics",
        "pharmacogenomics",
        "carrier-screening",
        "comprehensive"
      ]
    },
    {
      "key": "consentGiven",
      "label": "Consent Given",
      "type": "checkbox"
    },
    {
      "key": "dataProcessingConsent",
      "label": "Data Processing Consent",
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
