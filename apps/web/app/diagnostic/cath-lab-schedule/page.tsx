'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "cath-lab-schedule",
  "title": "Cath Lab Schedule",
  "subtitle": "Door-to-Balloon \u00b7 Pre-Procedure Checklist \u00b7 Stent Tracking",
  "apiPath": "/diagnostic/cath-lab-schedule",
  "regulations": [
    {
      "body": "SCAI/CSI",
      "citation": "Cath Lab Standards",
      "requirement": "STEMI door-to-balloon <90min. Pre-procedure checklist mandatory. Stent/consumable lot tracking."
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
      "key": "procedureType",
      "label": "Procedure"
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
      "key": "procedureType",
      "label": "Procedure",
      "type": "select",
      "options": [
        "Diagnostic Angiogram",
        "PCI",
        "Pacemaker",
        "EP Study"
      ],
      "required": true
    },
    {
      "key": "scheduledDate",
      "label": "Scheduled Date",
      "type": "date"
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
