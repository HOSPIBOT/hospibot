'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "dtc-consumer",
  "title": "DTC Consumer",
  "subtitle": "Online Ordering \u00b7 Home Collection \u00b7 Digital Results \u00b7 DPDPA",
  "apiPath": "/diagnostic/dtc-consumer",
  "regulations": [
    {
      "body": "MeitY",
      "citation": "DPDPA 2023",
      "requirement": "Consumer data privacy. Consent management. Abnormal result follow-up. Digital report delivery."
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
      "key": "packageName",
      "label": "Package"
    },
    {
      "key": "orderStatus",
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
      "key": "packageName",
      "label": "Package",
      "type": "text"
    },
    {
      "key": "collectionType",
      "label": "Collection",
      "type": "select",
      "options": [
        "home-collection",
        "walk-in",
        "camp"
      ]
    },
    {
      "key": "consentGiven",
      "label": "Consent Given",
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
