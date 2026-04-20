'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "ivf-embryology-lab",
  "title": "IVF / Embryology Lab",
  "subtitle": "Semen Analysis \u00b7 IVF/ICSI \u00b7 Embryo Culture \u00b7 Cryo \u00b7 PGT \u00b7 ART Act",
  "apiPath": "/diagnostic/ivf-embryology-lab",
  "regulations": [
    {
      "body": "ICMR/MoHFW",
      "citation": "ART Act 2021, ICMR ART Guidelines",
      "requirement": "ART clinic registration. Witness system (dual identity verification). Embryo storage consent renewal every 5 years. Sex selection prohibited."
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
      "key": "entryType",
      "label": "Type"
    },
    {
      "key": "cycleId",
      "label": "Cycle"
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
      "key": "entryType",
      "label": "Type",
      "type": "select",
      "required": true,
      "options": [
        "semen-analysis",
        "oocyte-retrieval",
        "icsi",
        "embryo-culture",
        "embryo-transfer",
        "cryopreservation",
        "pgt",
        "thaw"
      ]
    },
    {
      "key": "cycleId",
      "label": "Cycle ID",
      "type": "text"
    },
    {
      "key": "witnessVerified",
      "label": "Witness Verified",
      "type": "checkbox"
    },
    {
      "key": "artActCompliant",
      "label": "ART Act Compliant",
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
