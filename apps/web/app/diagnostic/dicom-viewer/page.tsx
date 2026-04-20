'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "dicom-viewer",
  "title": "DICOM Viewer",
  "subtitle": "PACS Integration \u00b7 Study UID \u00b7 Modality \u00b7 Report Status",
  "apiPath": "/diagnostic/dicom-viewer",
  "regulations": [
    {
      "body": "NABL",
      "citation": "NABL 135 Teleradiology",
      "requirement": "DICOM/PACS integration. Study Instance UID tracking. Report lifecycle."
    }
  ],
  "columns": [
    {
      "key": "studyDate",
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
      "key": "reportStatus",
      "label": "Report"
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
      "type": "text"
    },
    {
      "key": "accessionNumber",
      "label": "Accession No",
      "type": "text"
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
        "Mammography",
        "PET-CT"
      ]
    },
    {
      "key": "studyDescription",
      "label": "Study Description",
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
