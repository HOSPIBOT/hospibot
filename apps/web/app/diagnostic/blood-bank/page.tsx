'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "blood-bank",
  "title": "Blood Bank",
  "subtitle": "Donor \u00b7 Components \u00b7 Cross-Match \u00b7 Issue \u00b7 NACO Compliance",
  "apiPath": "/diagnostic/blood-bank",
  "regulations": [
    {
      "body": "NACO",
      "citation": "Standards for Blood Banks & BTS, D&C Act 1940",
      "requirement": "Mandatory 5 TTI screening (HIV/HBsAg/HCV/Syphilis/Malaria). Donor eligibility: Age 18-65, Hb \u226512.5 g/dL. eRakt portal integration."
    }
  ],
  "columns": [
    {
      "key": "createdAt",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "entryType",
      "label": "Type"
    },
    {
      "key": "donorName",
      "label": "Donor"
    },
    {
      "key": "bagNumber",
      "label": "Bag No"
    },
    {
      "key": "status",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "entryType",
      "label": "Entry Type",
      "type": "select",
      "required": true,
      "options": [
        "donation",
        "component-separation",
        "cross-match",
        "issue",
        "transfusion-reaction"
      ]
    },
    {
      "key": "donorName",
      "label": "Donor Name",
      "type": "text"
    },
    {
      "key": "donorBloodGroup",
      "label": "Blood Group",
      "type": "select",
      "options": [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-"
      ]
    },
    {
      "key": "bagNumber",
      "label": "Bag Number",
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
