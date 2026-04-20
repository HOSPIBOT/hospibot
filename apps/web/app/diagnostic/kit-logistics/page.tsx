'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "kit-logistics",
  "title": "Kit Logistics",
  "subtitle": "Reagent Inventory \u00b7 FEFO \u00b7 Cold Chain \u00b7 NABL \u00a76.6",
  "apiPath": "/diagnostic/kit-logistics",
  "regulations": [
    {
      "body": "NABL",
      "citation": "112A \u00a76.6, ISO 15189:2022",
      "requirement": "FEFO inventory. Lot tracking. CoA verification. Cold chain. Segregation: untested/accepted/expired/rejected."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "itemName",
      "label": "Item"
    },
    {
      "key": "lotNumber",
      "label": "Lot"
    },
    {
      "key": "expiryAlert",
      "label": "Expiry"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "itemName",
      "label": "Item Name",
      "type": "text",
      "required": true
    },
    {
      "key": "category",
      "label": "Category",
      "type": "select",
      "options": [
        "reagent",
        "consumable",
        "calibrator",
        "control",
        "media"
      ]
    },
    {
      "key": "lotNumber",
      "label": "Lot Number",
      "type": "text"
    },
    {
      "key": "manufacturer",
      "label": "Manufacturer",
      "type": "text"
    },
    {
      "key": "expiryDate",
      "label": "Expiry Date",
      "type": "date"
    },
    {
      "key": "quantityOnHand",
      "label": "Qty On Hand",
      "type": "number"
    },
    {
      "key": "coldChainRequired",
      "label": "Cold Chain",
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
