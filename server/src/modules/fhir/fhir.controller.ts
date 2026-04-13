import { Controller, Get, Post, Param, Query, Body, Headers, Res } from '@nestjs/common';
import { FhirService } from './fhir.service';

/**
 * FHIR R4 compliant endpoints for ABDM Health Information Provider (HIP) compliance.
 * Base path: /fhir/r4
 * Spec: https://www.hl7.org/fhir/R4/
 */
@Controller('fhir/r4')
export class FhirController {
  constructor(private readonly fhirService: FhirService) {}

  // ── Capability Statement ───────────────────────────────────────────────────
  @Get('metadata')
  getCapabilityStatement() {
    return this.fhirService.getCapabilityStatement();
  }

  // ── Patient resource ───────────────────────────────────────────────────────
  @Get('Patient')
  searchPatients(
    @Query('phone') phone?: string,
    @Query('identifier') identifier?: string,
    @Query('name') name?: string,
    @Query('_count') count?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.fhirService.searchPatients({ phone, identifier, name, tenantId, count: count ? +count : 10 });
  }

  @Get('Patient/:id')
  getPatient(@Param('id') id: string, @Headers('x-tenant-id') tenantId?: string) {
    return this.fhirService.getPatient(id, tenantId);
  }

  // ── Observation (vitals, lab results) ─────────────────────────────────────
  @Get('Observation')
  searchObservations(
    @Query('patient') patientId?: string,
    @Query('category') category?: string,
    @Query('_count') count?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.fhirService.searchObservations({ patientId, category, tenantId, count: count ? +count : 20 });
  }

  @Get('Observation/:id')
  getObservation(@Param('id') id: string) {
    return this.fhirService.getObservation(id);
  }

  // ── MedicationRequest (prescriptions) ─────────────────────────────────────
  @Get('MedicationRequest')
  searchMedicationRequests(
    @Query('patient') patientId?: string,
    @Query('status') status?: string,
    @Query('_count') count?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.fhirService.searchMedicationRequests({ patientId, status, tenantId, count: count ? +count : 20 });
  }

  @Get('MedicationRequest/:id')
  getMedicationRequest(@Param('id') id: string) {
    return this.fhirService.getMedicationRequest(id);
  }

  // ── Condition (diagnoses) ──────────────────────────────────────────────────
  @Get('Condition')
  searchConditions(
    @Query('patient') patientId?: string,
    @Query('_count') count?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.fhirService.searchConditions({ patientId, tenantId, count: count ? +count : 20 });
  }

  // ── DiagnosticReport (lab reports) ────────────────────────────────────────
  @Get('DiagnosticReport')
  searchDiagnosticReports(
    @Query('patient') patientId?: string,
    @Query('_count') count?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.fhirService.searchDiagnosticReports({ patientId, tenantId, count: count ? +count : 20 });
  }

  // ── Appointment resource ───────────────────────────────────────────────────
  @Get('Appointment')
  searchAppointments(
    @Query('patient') patientId?: string,
    @Query('date') date?: string,
    @Query('_count') count?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.fhirService.searchAppointments({ patientId, date, tenantId, count: count ? +count : 20 });
  }

  // ── Bundle (everything for a patient) ─────────────────────────────────────
  @Get('Patient/:id/$everything')
  getEverything(@Param('id') id: string, @Headers('x-tenant-id') tenantId?: string) {
    return this.fhirService.getPatientEverything(id, tenantId);
  }
}
