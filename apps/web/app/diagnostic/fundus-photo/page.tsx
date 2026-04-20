'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "fundus-photo",
  "title": "Fundus Photography",
  "subtitle": "DR Grading \u00b7 ETDRS \u00b7 DME Detection \u00b7 Screening",
  "apiPath": "/diagnostic/fundus-photo",
  "regulations": [
    {
      "body": "RSSDI/ICO",
      "citation": "DR Screening Guidelines",
      "requirement": "DR grading: No DR/Mild-Mod-Severe NPDR/PDR. DME detection. ETDRS standard."
    }
  ],
  "columns": [
    {
      "key": "photoDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "eye",
      "label": "Eye"
    },
    {
      "key": "drGrade",
      "label": "DR Grade"
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
      "key": "eye",
      "label": "Eye",
      "type": "select",
      "required": true,
      "options": [
        "OD",
        "OS",
        "OU"
      ]
    },
    {
      "key": "drGrade",
      "label": "DR Grade",
      "type": "select",
      "options": [
        "No DR",
        "Mild NPDR",
        "Moderate NPDR",
        "Severe NPDR",
        "PDR"
      ]
    },
    {
      "key": "dmePresent",
      "label": "DME Present",
      "type": "checkbox"
    },
    {
      "key": "mydriatic",
      "label": "Mydriatic",
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
