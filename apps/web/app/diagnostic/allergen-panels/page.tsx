'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "allergen-panels",
  "title": "Allergen Panels",
  "subtitle": "SPT \u00b7 Specific IgE \u00b7 CRD \u00b7 Anaphylaxis Kit",
  "apiPath": "/diagnostic/allergen-panels",
  "regulations": [
    {
      "body": "WAO",
      "citation": "IgE Diagnostics Position Paper",
      "requirement": "SPT gold standard for aeroallergens. Wheal \u22653mm positive. Anaphylaxis kit mandatory."
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
      "key": "testMethod",
      "label": "Method"
    },
    {
      "key": "positiveCount",
      "label": "Positive"
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
      "key": "testMethod",
      "label": "Method",
      "type": "select",
      "required": true,
      "options": [
        "spt",
        "specific-ige",
        "crd",
        "intradermal",
        "patch"
      ]
    },
    {
      "key": "panelCategory",
      "label": "Category",
      "type": "select",
      "options": [
        "food",
        "inhalant",
        "animal-dander",
        "insect",
        "mold",
        "pollen"
      ]
    },
    {
      "key": "anaphylaxisKitPresent",
      "label": "Anaphylaxis Kit",
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
