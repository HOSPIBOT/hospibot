'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "radiotracer-log",
  "title": "Radiotracer Log",
  "subtitle": "FDG Administration \u00b7 Batch Tracking \u00b7 Half-Life \u00b7 AERB Dose Limits",
  "apiPath": "/diagnostic/radiotracer-log",
  "regulations": [
    {
      "body": "AERB",
      "citation": "SC-2 Rev.2, AE(RP) Rules 2004",
      "requirement": "Track radiotracer administration, batch numbers, patient dose (MBq), half-life decay. AERB dose limits enforced."
    }
  ],
  "columns": [
    {
      "key": "runDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "batchId",
      "label": "Batch ID"
    },
    {
      "key": "testName",
      "label": "Test"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "batchId",
      "label": "Batch ID",
      "type": "text",
      "required": true
    },
    {
      "key": "testName",
      "label": "Test Name",
      "type": "text",
      "required": true
    },
    {
      "key": "runDate",
      "label": "Run Date",
      "type": "date"
    },
    {
      "key": "biosafetyLevel",
      "label": "Biosafety Level",
      "type": "select",
      "options": [
        "BSL-1",
        "BSL-2",
        "BSL-3"
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
