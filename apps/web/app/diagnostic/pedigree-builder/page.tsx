'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "pedigree-builder",
  "title": "Pedigree Builder",
  "subtitle": "NHGRI Notation \u00b7 Inheritance \u00b7 Family Tree",
  "apiPath": "/diagnostic/pedigree-builder",
  "regulations": [
    {
      "body": "NHGRI",
      "citation": "Standard Pedigree Notation",
      "requirement": "NHGRI notation. Inheritance patterns: AD/AR/XL/Mito. Consanguinity tracking."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "probandName",
      "label": "Proband"
    },
    {
      "key": "inheritancePattern",
      "label": "Pattern"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "probandName",
      "label": "Proband Name",
      "type": "text",
      "required": true
    },
    {
      "key": "condition",
      "label": "Condition",
      "type": "text"
    },
    {
      "key": "inheritancePattern",
      "label": "Inheritance",
      "type": "select",
      "options": [
        "AD",
        "AR",
        "X-Linked",
        "Mitochondrial",
        "Multifactorial"
      ]
    },
    {
      "key": "generations",
      "label": "Generations",
      "type": "number"
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
