using { sap.capire.incidents as my } from '../db/schema';

/**
 * Service used by support personnel (processors).
 * 
 * IMPORTANT: Service is open to any authenticated user so Fiori
 * can load $metadata without freezing. The 'support' role is
 * enforced at the entity level instead.
 */
service ProcessorService {

    @restrict: [
        { grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], to: 'support' }
    ]
    entity Incidents as projection on my.Incidents;

    @restrict: [
        { grant: ['READ'], to: 'support' }
    ]
    @readonly
    entity Customers as projection on my.Customers;
}

// ✅ Single string — OR logic → any logged-in user can load $metadata
annotate ProcessorService with @(requires: 'authenticated-user');

annotate ProcessorService.Incidents with @odata.draft.enabled;

service AdminService {
    entity Customers as projection on my.Customers;
    entity Incidents as projection on my.Incidents;
}
annotate AdminService with @(requires: 'admin');
