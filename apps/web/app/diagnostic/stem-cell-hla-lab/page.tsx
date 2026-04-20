'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "stem-cell-hla-lab",
  "title": "Stem Cell & HLA Lab",
  "subtitle": "HLA Typing \u00b7 Donor Registry \u00b7 Cord Blood \u00b7 DATRI/WMDA",
  "apiPath": "/diagnostic/stem-cell-hla-lab",
  "regulations": [
    {
      "body": "WMDA/DATRI",
      "citation": "Donor Registry Standards, GMP",
      "requirement": "HLA typing (A/B/C/DRB1/DQB1). DATRI/WMDA registry sync. Cord blood banking license (DCGI). GMP for cell processing."
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
      "key": "matchScore",
      "label": "Match"
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
        "hla-typing",
        "donor-search",
        "cord-blood-processing",
        "cord-blood-banking",
        "workup",
        "collection"
      ]
    },
    {
      "key": "hlaA",
      "label": "HLA-A",
      "type": "text"
    },
    {
      "key": "hlaB",
      "label": "HLA-B",
      "type": "text"
    },
    {
      "key": "registryName",
      "label": "Registry",
      "type": "select",
      "options": [
        "DATRI",
        "WMDA",
        "NMDP",
        "BMDW"
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
