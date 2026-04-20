/**
 * HL7 v2.x Message Parser
 * Supports ORU^R01 (Observation Result Unsolicited) — the primary message
 * type sent by lab analyzers when results are ready.
 * 
 * Segment structure:
 *   MSH — Message Header (sending app, message type, version)
 *   PID — Patient Identification (name, DOB, gender, MRN)
 *   OBR — Observation Request (test order, accession number)
 *   OBX — Observation Result (individual test results with values, units, ranges, flags)
 *
 * Common analyzers supported:
 *   Sysmex (hematology: XN-1000/XN-2000/XN-3000)
 *   Roche Cobas (biochemistry: c311/c501/c702)
 *   Ortho Vitros (biochemistry: 5600/XT7600)
 *   Abbott Architect (immunoassay: i1000/i2000)
 *   Mindray (hematology: BC-6800, biochemistry: BS-800)
 *   Beckman Coulter (hematology: DxH 800)
 *   Siemens Atellica (chemistry/immunoassay)
 */

export interface HL7Message {
  raw: string;
  msh: MSHSegment;
  pid?: PIDSegment;
  obr: OBRSegment[];
  obx: OBXResult[];
  parseErrors: string[];
}

export interface MSHSegment {
  fieldSeparator: string;
  encodingChars: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  dateTime: string;
  messageType: string;
  triggerEvent: string;
  messageControlId: string;
  processingId: string;
  versionId: string;
}

export interface PIDSegment {
  patientId: string;
  patientName: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
}

export interface OBRSegment {
  setId: number;
  placerOrderNumber: string;
  fillerOrderNumber: string;
  universalServiceId: string;
  universalServiceName: string;
  observationDateTime: string;
  resultStatus: string;
  diagnosticServSectId: string;
}

export interface OBXResult {
  setId: number;
  valueType: string;
  observationId: string;
  observationName: string;
  observationSubId: string;
  value: string;
  numericValue: number | null;
  units: string;
  referenceRange: string;
  abnormalFlag: string; // N=Normal, H=High, L=Low, HH=Critical High, LL=Critical Low
  resultStatus: string; // F=Final, P=Preliminary, C=Corrected
  observationDateTime: string;
}

export function parseHL7Message(raw: string): HL7Message {
  const errors: string[] = [];
  const lines = raw.replace(/\r\n/g, '\r').replace(/\n/g, '\r').split('\r').filter(l => l.trim());
  
  let msh: MSHSegment = {} as any;
  let pid: PIDSegment | undefined;
  const obr: OBRSegment[] = [];
  const obx: OBXResult[] = [];
  
  let fieldSep = '|';
  let compSep = '^';
  
  for (const line of lines) {
    try {
      const segType = line.substring(0, 3);
      
      if (segType === 'MSH') {
        fieldSep = line[3] || '|';
        const fields = line.split(fieldSep);
        const encChars = fields[1] || '^~\\&';
        compSep = encChars[0] || '^';
        
        msh = {
          fieldSeparator: fieldSep,
          encodingChars: encChars,
          sendingApplication: fields[2] || '',
          sendingFacility: fields[3] || '',
          receivingApplication: fields[4] || '',
          receivingFacility: fields[5] || '',
          dateTime: fields[6] || '',
          messageType: (fields[8] || '').split(compSep)[0] || '',
          triggerEvent: (fields[8] || '').split(compSep)[1] || '',
          messageControlId: fields[9] || '',
          processingId: fields[10] || '',
          versionId: fields[11] || '',
        };
      }
      
      else if (segType === 'PID') {
        const fields = line.split(fieldSep);
        const nameParts = (fields[5] || '').split(compSep);
        pid = {
          patientId: (fields[3] || '').split(compSep)[0] || '',
          patientName: fields[5] || '',
          lastName: nameParts[0] || '',
          firstName: nameParts[1] || '',
          dob: fields[7] || '',
          gender: fields[8] || '',
          address: fields[11] || '',
          phone: fields[13] || '',
        };
      }
      
      else if (segType === 'OBR') {
        const fields = line.split(fieldSep);
        const svcParts = (fields[4] || '').split(compSep);
        obr.push({
          setId: parseInt(fields[1]) || 1,
          placerOrderNumber: fields[2] || '',
          fillerOrderNumber: fields[3] || '',
          universalServiceId: svcParts[0] || '',
          universalServiceName: svcParts[1] || '',
          observationDateTime: fields[7] || fields[14] || '',
          resultStatus: fields[25] || 'F',
          diagnosticServSectId: fields[24] || '',
        });
      }
      
      else if (segType === 'OBX') {
        const fields = line.split(fieldSep);
        const obsParts = (fields[3] || '').split(compSep);
        const val = fields[5] || '';
        const numVal = parseFloat(val);
        
        obx.push({
          setId: parseInt(fields[1]) || 0,
          valueType: fields[2] || 'NM',
          observationId: obsParts[0] || '',
          observationName: obsParts[1] || '',
          observationSubId: fields[4] || '',
          value: val,
          numericValue: isNaN(numVal) ? null : numVal,
          units: (fields[6] || '').split(compSep)[0] || '',
          referenceRange: fields[7] || '',
          abnormalFlag: fields[8] || '',
          resultStatus: fields[11] || 'F',
          observationDateTime: fields[14] || '',
        });
      }
    } catch (err: any) {
      errors.push(`Error parsing line: ${line.substring(0, 50)}... — ${err.message}`);
    }
  }
  
  return { raw, msh, pid, obr, obx, parseErrors: errors };
}

/**
 * Generate HL7 ACK (Acknowledgment) message
 * Sent back to analyzer to confirm receipt
 */
export function generateACK(msh: MSHSegment, ackCode: 'AA' | 'AE' | 'AR' = 'AA', errorMsg?: string): string {
  const now = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
  const ack = [
    `MSH|^~\\&|HOSPIBOT|LIS|${msh.sendingApplication}|${msh.sendingFacility}|${now}||ACK^${msh.triggerEvent}|${now}|P|${msh.versionId}`,
    `MSA|${ackCode}|${msh.messageControlId}${errorMsg ? `|${errorMsg}` : ''}`,
  ].join('\r');
  return ack;
}

/**
 * Parse ASTM E1394 messages (older protocol used by some analyzers)
 * ASTM uses record types: H (Header), P (Patient), O (Order), R (Result), L (Terminator)
 */
export function parseASTMMessage(raw: string): HL7Message {
  const errors: string[] = [];
  const lines = raw.split(/[\r\n]+/).filter(l => l.trim());
  
  let msh: MSHSegment = { fieldSeparator: '|', encodingChars: '^~\\&', sendingApplication: 'ASTM_DEVICE',
    sendingFacility: '', receivingApplication: 'HOSPIBOT', receivingFacility: 'LIS',
    dateTime: '', messageType: 'ORU', triggerEvent: 'R01', messageControlId: `ASTM-${Date.now()}`,
    processingId: 'P', versionId: 'ASTM' };
  let pid: PIDSegment | undefined;
  const obr: OBRSegment[] = [];
  const obx: OBXResult[] = [];
  let obxCount = 0;
  
  for (const line of lines) {
    try {
      const recType = line[0];
      // Strip frame chars (STX, ETX, etc)
      const cleanLine = line.replace(/[\x02\x03\x04\x05\x06\x15\x17]/g, '');
      const fields = cleanLine.split('|');
      
      if (recType === 'H') {
        // Header record
        msh.sendingApplication = fields[4] || fields[2] || 'ANALYZER';
        msh.dateTime = fields[13] || new Date().toISOString();
      }
      else if (recType === 'P') {
        // Patient record
        pid = {
          patientId: fields[3] || '',
          patientName: fields[5] || '',
          firstName: (fields[5] || '').split('^')[1] || '',
          lastName: (fields[5] || '').split('^')[0] || '',
          dob: fields[7] || '',
          gender: fields[8] || '',
          address: '', phone: '',
        };
      }
      else if (recType === 'O') {
        // Order record
        obr.push({
          setId: obr.length + 1,
          placerOrderNumber: fields[2] || '',
          fillerOrderNumber: fields[3] || '',
          universalServiceId: (fields[4] || '').split('^')[3] || fields[4] || '',
          universalServiceName: (fields[4] || '').split('^')[4] || '',
          observationDateTime: fields[6] || '',
          resultStatus: 'F', diagnosticServSectId: '',
        });
      }
      else if (recType === 'R') {
        // Result record
        obxCount++;
        const testParts = (fields[2] || '').split('^');
        const val = fields[3] || '';
        const numVal = parseFloat(val);
        obx.push({
          setId: obxCount,
          valueType: isNaN(numVal) ? 'ST' : 'NM',
          observationId: testParts[3] || testParts[0] || '',
          observationName: testParts[4] || testParts[1] || '',
          observationSubId: '',
          value: val,
          numericValue: isNaN(numVal) ? null : numVal,
          units: fields[4] || '',
          referenceRange: fields[5] || '',
          abnormalFlag: fields[6] || '',
          resultStatus: fields[8] || 'F',
          observationDateTime: fields[12] || '',
        });
      }
    } catch (err: any) {
      errors.push(`ASTM parse error: ${err.message}`);
    }
  }
  
  return { raw, msh, pid, obr, obx, parseErrors: errors };
}
