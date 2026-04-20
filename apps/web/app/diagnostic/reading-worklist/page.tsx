'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "reading-worklist",
  "title": "Reading Worklist",
  "subtitle": "Priority Queue \u00b7 Study Lifecycle \u00b7 Critical Finding Flag",
  "apiPath": "/diagnostic/reading-worklist",
  "regulations": [
    {
      "body": "NABL",
      "citation": "ISO 15189:2022",
      "requirement": "Priority-ordered queue. Study lifecycle tracking. Critical finding flag and communication protocol."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "modality",
      "label": "Modality"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "patientName",
      "label": "Patient Name",
      "type": "text",
      "required": true
    },
    {
      "key": "modality",
      "label": "Modality",
      "type": "select",
      "options": [
        "X-Ray",
        "CT",
        "MRI",
        "USG",
        "Mammography"
      ],
      "required": true
    },
    {
      "key": "priority",
      "label": "Priority",
      "type": "select",
      "options": [
        "STAT",
        "Urgent",
        "Routine"
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
