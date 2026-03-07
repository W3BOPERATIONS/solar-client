import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateApi } from '../../api/candidateApi';
import candidateStore from '../../store/candidateStore';

const CompleteApplication = () => {
    const navigate = useNavigate();
    const candidate = candidateStore((state) => state.candidate);
    const setCandidate = candidateStore((state) => state.setCandidate);

    const [preferredJoiningDate, setPreferredJoiningDate] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if eligible
        if (!candidate || candidate.status !== 'Test Completed') {
            navigate('/candidate-portal/dashboard');
        }
    }, [candidate, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!preferredJoiningDate) {
            setError("Please select a preferred joining date.");
            return;
        }
        if (!agreedToTerms) {
            setError("You must agree to the terms.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await candidateApi.submitApplication({ preferredJoiningDate, agreedToTerms });
            if (data.success) {
                setCandidate({
                    ...candidate,
                    status: data.status,
                    preferredJoiningDate,
                    agreedToTerms
                });
                alert('Application submitted successfully!');
                navigate('/candidate-portal/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const officialDate = candidate?.vacancy?.joiningDate
        ? new Date(candidate.vacancy.joiningDate).toISOString().split('T')[0]
        : '';

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Application</h2>

            {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-gray-700 font-medium mb-2">Preferred Date of Joining <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        value={preferredJoiningDate}
                        max={officialDate}
                        onChange={(e) => setPreferredJoiningDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                    {officialDate && (
                        <p className="text-sm text-gray-500 mt-1">
                            Must be on or before the official joining date: {new Date(officialDate).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="bg-gray-50 p-4 border rounded">
                    <h4 className="font-semibold text-gray-700 mb-2">Job Description Summary</h4>
                    <p className="text-sm text-gray-600 mb-4">
                        {candidate?.vacancy?.description?.substring(0, 300)}
                        {candidate?.vacancy?.description?.length > 300 ? '...' : ''}
                    </p>
                    <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-1 h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            required
                        />
                        <span className="text-sm text-gray-700">
                            I agree with the job description and I am willing to join on the selected joining date if I am selected for this position.
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-indigo-600 text-white font-medium py-3 rounded hover:bg-indigo-700 transition ${loading ? 'opacity-50' : ''}`}
                >
                    {loading ? 'Submitting...' : 'Submit Application'}
                </button>
            </form>
        </div>
    );
};

export default CompleteApplication;
