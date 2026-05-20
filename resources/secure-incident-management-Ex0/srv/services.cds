using { sap.capire.incidents as my } from '../db/schema';

/**
 * Service used by support personnel, i.e. the incidents' 'processors'.
 */
service ProcessorService {

    @requires: 'support'
    entity Incidents as projection on my.Incidents;

    @readonly
    @requires: 'support'
    entity Customers as projection on my.Customers;
}

annotate ProcessorService with @(requires: 'authenticated-user');
annotate ProcessorService.Incidents with @odata.draft.enabled;

/**
 * Service used by administrators to manage customers and incidents.
 */
service AdminService {
    entity Customers as projection on my.Customers;
    entity Incidents as projection on my.Incidents;
    }
annotate AdminService with @(requires: 'admin');
