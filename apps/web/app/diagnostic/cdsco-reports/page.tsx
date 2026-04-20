'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "cdsco-reports",
  "title": "CDSCO Reports",
  "subtitle": "IVD Classes A-D \u00b7 Adverse Events \u00b7 Kit Validation \u00b7 SUGAM",
  "apiPath": "/diagnostic/cdsco-reports",
  "regulations": [
    {
      "body": "CDSCO",
      "citation": "Medical Devices Rules 2017",
      "requirement": "IVD risk classes A-D. SUGAM portal. Adverse event reporting. Post-market surveillance."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "reportType",
      "label": "Type"
    },
    {
      "key": "deviceName",
      "label": "Device"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "reportType",
      "label": "Type",
      "type": "select",
      "required": true,
      "options": [
        "adverse-event",
        "post-market-surveillance",
        "kit-validation",
        "license-renewal"
      ]
    },
    {
      "key": "deviceName",
      "label": "Device Name",
      "type": "text"
    },
    {
      "key": "deviceClass",
      "label": "Class",
      "type": "select",
      "options": [
        "A",
        "B",
        "C",
        "D"
      ]
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
