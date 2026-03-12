import { Route } from "react-router-dom";

import MissionList from './pages/MissionList';
import MissionDetail from './pages/MissionDetail';
import MissionCreate from './pages/MissionCreate';
import MissionEdit from './pages/MissionEdit';

export const missionRoutes = (
    <>
        <Route path="/missions" element={<MissionList />} />
        <Route path="/missions/:id" element={<MissionDetail />} />
        <Route path="/missions/create" element={<MissionCreate />} />
        <Route path="/missions/edit/:id" element={<MissionEdit />} />
    </>
);