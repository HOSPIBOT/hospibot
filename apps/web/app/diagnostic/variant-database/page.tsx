'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "variant-database",
  "title": "Variant Database",
  "subtitle": "ACMG 5-Tier \u00b7 HGVS \u00b7 ClinVar \u00b7 REVEL/CADD",
  "apiPath": "/diagnostic/variant-database",
  "regulations": [
    {
      "body": "ACMG/AMP",
      "citation": "2015 Variant Classification Standards",
      "requirement": "5-tier: Pathogenic/Likely Pathogenic/VUS/Likely Benign/Benign. 28 evidence criteria. ClinVar cross-reference."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "gene",
      "label": "Gene"
    },
    {
      "key": "acmgClass",
      "label": "ACMG Class"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "gene",
      "label": "Gene",
      "type": "text",
      "required": true
    },
    {
      "key": "acmgClass",
      "label": "ACMG Class",
      "type": "select",
      "required": true,
      "options": [
        "Pathogenic",
        "Likely Pathogenic",
        "VUS",
        "Likely Benign",
        "Benign"
      ]
    },
    {
      "key": "hgvsC",
      "label": "HGVS (coding)",
      "type": "text"
    },
    {
      "key": "hgvsP",
      "label": "HGVS (protein)",
      "type": "text"
    },
    {
      "key": "clinvarId",
      "label": "ClinVar ID",
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
