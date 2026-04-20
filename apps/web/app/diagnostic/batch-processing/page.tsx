'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "batch-processing",
  "title": "Batch Processing",
  "subtitle": "PCR Plates \u00b7 NGS Runs \u00b7 NABL 2-Level QC",
  "apiPath": "/diagnostic/batch-processing",
  "regulations": [
    {
      "body": "NABL",
      "citation": "112A / ISO 15189:2022 \u00a77.3.7",
      "requirement": "Two levels of QC per batch mandatory. Ct value tracking. Reagent lot traceability."
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
      "key": "batchType",
      "label": "Type"
    },
    {
      "key": "qcPassed",
      "label": "QC"
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
      "key": "batchType",
      "label": "Batch Type",
      "type": "select",
      "required": true,
      "options": [
        "rt-pcr",
        "conventional-pcr",
        "ngs-library",
        "multiplex"
      ]
    },
    {
      "key": "testName",
      "label": "Test Name",
      "type": "text"
    },
    {
      "key": "sampleCount",
      "label": "Sample Count",
      "type": "number"
    },
    {
      "key": "qcLevel1Result",
      "label": "QC Level 1",
      "type": "select",
      "options": [
        "pass",
        "fail"
      ]
    },
    {
      "key": "qcLevel2Result",
      "label": "QC Level 2",
      "type": "select",
      "options": [
        "pass",
        "fail"
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
