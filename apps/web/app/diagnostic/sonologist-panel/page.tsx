'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "sonologist-panel",
  "title": "Sonologist Panel",
  "subtitle": "PC-PNDT 2-Place Rule \u00b7 MCI Registration \u00b7 Form F",
  "apiPath": "/diagnostic/sonologist-panel",
  "regulations": [
    {
      "body": "MoHFW",
      "citation": "PC-PNDT Act 1994/2003",
      "requirement": "Sonologist must have MCI registration. 2-place rule enforcement. Form F mandatory for every obstetric USG."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "sonologistName",
      "label": "Sonologist"
    },
    {
      "key": "mciRegNo",
      "label": "MCI Reg"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "sonologistName",
      "label": "Sonologist Name",
      "type": "text",
      "required": true
    },
    {
      "key": "mciRegNo",
      "label": "MCI Reg No",
      "type": "text",
      "required": true
    },
    {
      "key": "qualification",
      "label": "Qualification",
      "type": "text"
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
