# Rules To Follow When Working In The Backend (`./backend`)

- always document the finished routes with swagger documentation only after you finished the implementation without any issues or errors, make sure that the shapes of the payload and responses is documented accurately and properly.

- if also possible please add a unit and integration tests to any route/controllers that you have only finished implementing without any issues and errors, never manipulate the old tests cases, only create one if you implemented a new feature/function of the backend system.

- always remember and consider that this project is using a repository pattern when it comes to uploading images and saving/reading data in the database.

- don't use magic numbers and very short names that hides the intent or purpose of a component, function, variable, method, type, object, class, file and folder structure.
