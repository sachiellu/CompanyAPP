import { Route } from "react-router-dom";
import UserList from "./pages/UserList";

export const userRoutes = (
    <>
        <Route path="/users" element={<UserList />} />
    </>
);