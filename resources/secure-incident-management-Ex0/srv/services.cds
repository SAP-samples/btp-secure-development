using { sap.capire.incidents as my } from '../db/schema';

/**
 * Service used by support personnel, i.e. the incidents' 'processors'.
 */
service ProcessorService {

    @requires: 'support'                               // ❌ VULNERABILITY: 'support' role grants unrestricted access to all operations.
                                                       // ❌ Missing row-level or field-level restrictions exposes sensitive incident data.
    entity Incidents as projection on my.Incidents;    // ✅ Only 'support' role can access all incidents (read, write, delete)

    @readonly                                          // ✅ Read-only customers (correct)
    @requires: 'support'
    entity Customers as projection on my.Customers;    // ✅ Only 'support' role can read customers
}

annotate ProcessorService.Incidents with @odata.draft.enabled;
annotate ProcessorService with @(requires: 'authenticated-user');  // ✅ Any logged-in user can load $metadata

/**
 * Service used by administrators to manage customers and incidents.
 */
service AdminService {
    entity Customers as projection on my.Customers;
    entity Incidents as projection on my.Incidents;
    }
annotate AdminService with @(requires: 'admin');
