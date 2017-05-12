# Breaking the Monolith by using hapi 
## Background
Let me get the disclaimer out of the way: I am not an expert on Hapi
I started looking into Hapi's ability to break components out.
This is my attempt to follow other tutorials from a hello world to a true component system.
I have broken this down into the following steps

| Project  | Description | Link |
|---|---|---|
|hapi-tut-monolith-01|A simple hello world hapi project| [01](https://github.com/quapaw/hapi-tut-monolith-01)|
|hapi-tut-monolith-02a|Add services - customers and products| [02A](https://github.com/quapaw/hapi-tut-monolith-02a)|
|hapi-tut-monolith-02b|Adding Glue and externalizing config| [02B](https://github.com/quapaw/hapi-tut-monolith-02b)|
|hapi-tut-monolith-02c|Moving services into their own folders| [02C](https://github.com/quapaw/hapi-tut-monolith-02c)|
|hapi-tut-monolith-03-main|Moved service into own project. Instructions here| [03-main](https://github.com/quapaw/hapi-tut-monolith-03-main)|
|hapi-tut-monolith-03-customer|Just the customer service| [03-customers](https://github.com/quapaw/hapi-tut-monolith-03-customers)|
|hapi-tut-monolith-03-products|Just the produce service| [03-products](https://github.com/quapaw/hapi-tut-monolith-03-products)|
|hapi-tut-monolith-04a-customer|Movement of some files| [04a-customers](https://github.com/quapaw/hapi-tut-monolith-04a-customers)|
|hapi-tut-monolith-04b-customer|New methods| [04b-customers](https://github.com/quapaw/hapi-tut-monolith-04b-customers)|
|**hapi-tut-monolith-04c-customer**|**Validation and Error Handling**|**[04c-customers](https://github.com/quapaw/hapi-tut-monolith-04c-customers)**|
|hapi-tut-monolith-04d-customer|Unit Testing|[04d-customers](https://github.com/quapaw/hapi-tut-monolith-04d-customers)|


#HAPI Tutorial - Monolith - 4 - Move toward production
This part of the tutorial will move the customer plugin more toward a production plugin.
This step, 04c, will add input validation and error handling.

* Validation will be handle by the hapi component called joi
    The github project is located here (https://github.com/hapijs/joi)

* HTTP Friendly Error objects will be handler by the hapi component called boom
    The github project is located here (https://github.com/hapijs/boom)
    
## Add Validation to input of our Routes

* Add joi to package.json by running ```npm install -save joi```
* add require statement in  index.js ```const Joi = require('joi');```

* Define the validation rules for the getById route
    Add the following config to the getById Route definition in index.js
    Note: I changed samples/customers.json to make the id a number instead of a string
    
    ```javascript
    config: {
          validate: {
            params: { id: Joi.number().integer() },
            query:  false,
            payload: false,
            options: { allowUnknown: false }
          }
      }
    ```
    
    This will make the route definition look like the following
    
    ```javascript
        server.route({method: 'GET',
                      path:   '/customers/{id}',
                      handler: routes.getByID,
                      config: {
                          validate: {
                            params: { id: Joi.number().integer() },
                            query:  false,
                            payload: false,
                            options: { allowUnknown: false }
                          }
                      }
                     });

    ```
    
    You can test by using the following url (http://localhost:3000/customers/123X)
    This will return an http status code of 400 and a message stating that the id must be a number.
    
    ```json
    {
      "statusCode": 400,
      "error": "Bad Request",
      "message": "child \"id\" fails because [\"id\" must be a number]",
      "validation": {
        "source": "params",
        "keys": [
          "id"
        ]
      }
    }
    ```
    
    
* Add validation to our post route.
    First step is to define the joi object that will validate the payload of the post in the index.js file
    
    ```javascript
        const PayloadSchema =
              Joi.object({
                    id:           Joi.number().required(),
                    first:        Joi.string().required(),
                    middle:       Joi.string().allow(null).optional(),
                    last:         Joi.string().required(),
                    addressLine:  Joi.string().required(),
                    city:         Joi.string().required(),
                    state:        Joi.string().required(),
                    postalCode:   Joi.string().required()
                });

    ```
        
    The next step is to add the validation to the route
    
    ```javascript
    config: {
        validate: {
            params: false,
            query:  false,
            payload: PayloadSchema,
            options: { allowUnknown: false }
        }
      }
    ```
    
    This will make the route definition look like the following:
     
    ```javascript
        server.route({method: 'POST',
                      path:   '/customers',
                      handler: routes.addCustomer,
                      config: {
                        validate: {
                            params: false,
                            query:  false,
                            payload: PayloadSchema,
                            options: { allowUnknown: false }
                        }
                      }
                     });

    ```
    
    You can test this by using curl.  You can leave out an attribute and see what the validation will return
    
    ```
    curl -X POST \
      http://localhost:3000/customers \
      -H 'cache-control: no-cache' \
      -H 'content-type: application/json' \
      -H 'postman-token: ac50ccdf-2597-0f7e-20de-a2553c87c42b' \
      -d '  {
          "id": "126",
          "middle": "H",
          "last":   "Father",
          "addressLine": "9 S. Ninth Street",
          "city":        "Little Rock",
          "state":       "AR",
          "postalCode":  "72206"
        }'
    ```
    
    By leaving out first name attribute you will get an http error code 400 with the following return object
    
    ```
    {
      "statusCode": 400,
      "error": "Bad Request",
      "message": "child \"first\" fails because [\"first\" is required]",
      "validation": {
        "source": "payload",
        "keys": [
          "first"
        ]
      }
    }
    ```
    
## Add error handling with boom
  
* First add boom to your packagin.json by running the following command ```npm install -save boom```
* Add require statement to CustomerRoutes.js ```const Boom = require('boom');```
* Use Boom to return the correct http error when customer getByID does not find the record
    Change the getByID to use ```return reply(Boom.notFound());``` when not found
    
    ```javascript
    getByID(request, reply) {

        const db = request.mongo.db;

        db.collection('customers').findOne({ id: request.params.id }, (err, doc) => {

            if (err) {
                return reply(Boom.wrap(err, 'Internal error'));
            }

            if (!doc) {
                return reply(Boom.notFound());
            }

            reply(doc);
        });
    };
    
    ```

    You can test by trying to get customer id of 999 (http://localhost:3000/customers/999)
    This will return http error code of 404 Not Found with the following body
    
    ```json
    {
      "statusCode": 404,
      "error": "Not Found"
    }    
    ```
    