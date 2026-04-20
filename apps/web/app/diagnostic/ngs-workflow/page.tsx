'use client';
import FeatureCrudPage from '../_shared/FeatureCrudPage';

const config = {
  "slug": "ngs-workflow",
  "title": "NGS Workflow",
  "subtitle": "Library Prep \u2192 Sequencing \u2192 Analysis \u00b7 Q30% \u00b7 Cluster Density",
  "apiPath": "/diagnostic/ngs-workflow",
  "regulations": [
    {
      "body": "CAP",
      "citation": "NGS Work Group 18-Point Checklist",
      "requirement": "Q30\u226580% pass. Cluster density, PF%, yield tracking. Pipeline version traceability."
    }
  ],
  "columns": [
    {
      "key": "runDate",
      "label": "Date",
      "fmt": "date"
    },
    {
      "key": "runId",
      "label": "Run ID"
    },
    {
      "key": "platform",
      "label": "Platform"
    },
    {
      "key": "runQuality",
      "label": "Quality"
    },
    {
      "key": "runStatus",
      "label": "Status",
      "fmt": "status"
    }
  ],
  "formFields": [
    {
      "key": "runId",
      "label": "Run ID",
      "type": "text",
      "required": true
    },
    {
      "key": "platform",
      "label": "Platform",
      "type": "select",
      "required": true,
      "options": [
        "Illumina MiSeq",
        "Illumina NextSeq",
        "Illumina NovaSeq",
        "Ion Torrent",
        "Nanopore"
      ]
    },
    {
      "key": "panelName",
      "label": "Panel",
      "type": "text"
    },
    {
      "key": "sampleCount",
      "label": "Samples",
      "type": "number"
    },
    {
      "key": "q30Pct",
      "label": "Q30 %",
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
