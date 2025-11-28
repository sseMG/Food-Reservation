# Rules To Follow When Working In The Frontend (`./frontend`)

- as much as possible don't store data in the browser memory local storage specially if that data is needed (or might be needed in the future) by both the admin and the student accounts, instead always prefer to save data in the database, then fetch it first when needed to be displayed in the frontend.

- don't use magic numbers and very short names that hides the intent or purpose of a component, function, variable, method, type, object, class, file and folder structure.
