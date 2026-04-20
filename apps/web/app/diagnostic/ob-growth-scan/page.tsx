'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "ob-growth-scan",
  "title": "OB Growth Scan",
  "subtitle": "Fetal Biometry \u00b7 BPD/HC/AC/FL \u00b7 EFW \u00b7 PC-PNDT Form F",
  "apiPath": "/diagnostic/ob-growth-scan",
  "regulations": [
    {
      "body": "MoHFW",
      "citation": "PC-PNDT Act 1994/2003",
      "requirement": "Form F mandatory for every obstetric USG. Fetal biometry: BPD, HC, AC, FL. EFW percentile. Doppler PI."
    }
  ],
  "columns": [
    {
      "key": "scanDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "gestationalWeeks",
      "label": "GA (wk)"
    },
    {
      "key": "efw",
      "label": "EFW (g)"
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
      "key": "gestationalWeeks",
      "label": "GA Weeks",
      "type": "number"
    },
    {
      "key": "bpd",
      "label": "BPD (mm)",
      "type": "number"
    },
    {
      "key": "hc",
      "label": "HC (mm)",
      "type": "number"
    },
    {
      "key": "ac",
      "label": "AC (mm)",
      "type": "number"
    },
    {
      "key": "fl",
      "label": "FL (mm)",
      "type": "number"
    },
    {
      "key": "efw",
      "label": "EFW (g)",
      "type": "number"
    },
    {
      "key": "pndtFormFCompleted",
      "label": "Form F Completed",
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
