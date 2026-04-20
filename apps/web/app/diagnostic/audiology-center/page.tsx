'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "audiology-center",
  "title": "Audiology Center",
  "subtitle": "PTA \u00b7 Tympanometry \u00b7 OAE \u00b7 BERA \u00b7 Hearing Aid \u00b7 Newborn Screening",
  "apiPath": "/diagnostic/audiology-center",
  "regulations": [
    {
      "body": "RBSK",
      "citation": "Newborn Hearing Screening Guidelines",
      "requirement": "Universal newborn hearing screening (OAE). Occupational hearing conservation per Factories Act."
    }
  ],
  "columns": [
    {
      "key": "testDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "patientName",
      "label": "Patient"
    },
    {
      "key": "testType",
      "label": "Test"
    },
    {
      "key": "hearingLossGrade",
      "label": "Grade"
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
      "key": "testType",
      "label": "Test",
      "type": "select",
      "required": true,
      "options": [
        "pta",
        "impedance",
        "oae",
        "bera",
        "speech-audiometry",
        "vng",
        "hearing-aid-fitting"
      ]
    },
    {
      "key": "ptaRightDb",
      "label": "PTA Right (dB)",
      "type": "number"
    },
    {
      "key": "ptaLeftDb",
      "label": "PTA Left (dB)",
      "type": "number"
    },
    {
      "key": "hearingAidRecommended",
      "label": "Hearing Aid Recommended",
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
