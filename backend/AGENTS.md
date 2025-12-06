# Rules To Follow When Working In The Backend (`./backend`)

- always document the finished routes with swagger documentation only after you finished the implementation without any issues or errors, make sure that the shapes of the payload and responses is documented accurately and properly.

- if also possible please add a unit and integration tests to any route/controllers that you have only finished implementing without any issues and errors, never manipulate the old tests cases, only create one if you implemented a new feature/function of the backend system.

- always remember and consider that this project is using a repository pattern when it comes to uploading images and saving/reading data in the database.

- don't use magic numbers and very short names that hides the intent or purpose of a component, function, variable, method, type, object, class, file and folder structure.

- also strictly don't edit test cases or test code in the backend/__tests__ folder, not even a single line edit should be allowed, You are only allowed to add new code at the end of the file, If you find yourself inserting new lines to the old test code you are doing it wrong, don't do that, appending code to the test case code is the only allowed action.