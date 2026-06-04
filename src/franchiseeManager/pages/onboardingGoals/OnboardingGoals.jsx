import React from 'react';
import { Navigate } from 'react-router-dom';

export default function FranchiseeManagerOnboardingGoals() {
    // Client requested to move goals to Profile and remove the table.
    // This page is now empty, so we redirect to the Profile page where the goals are now located.
    return <Navigate to="../profile" />;
}
