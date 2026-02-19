'use client';

import { useState, useEffect } from 'react';
import * as locationApi from '../services/locationApi';

export const useLocations = () => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load basic data on mount
  useEffect(() => {
    fetchCountries();
    fetchStates();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const data = await locationApi.getCountries();
      setCountries(data || []);
    } catch (err) {
      setError('Failed to load countries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update Clusters when State changes
  useEffect(() => {
    if (selectedState) {
      fetchClusters(selectedState);
    } else {
      setClusters([]);
    }
    // Only reset children if the parent actually changed (avoid infinite loops/unnecessary resets)
    setSelectedCluster('');
    setSelectedDistrict('');
    setSelectedCity('');
  }, [selectedState]);

  // Update Districts when Cluster changes
  useEffect(() => {
    if (selectedCluster) {
      fetchDistricts(selectedCluster);
    } else {
      setDistricts([]);
    }
    setSelectedDistrict('');
    setSelectedCity('');
  }, [selectedCluster]);

  // Update Cities when District changes
  useEffect(() => {
    if (selectedDistrict) {
      fetchCities(selectedDistrict);
    } else {
      setCities([]);
    }
    setSelectedCity('');
  }, [selectedDistrict]);

  const fetchStates = async (params = {}) => {
    try {
      setLoading(true);
      // Support both hierarchy and flat fetch based on presence of params
      const data = Object.keys(params).length > 0
        ? await locationApi.getStates(params.countryId)
        : await locationApi.getStatesHierarchy();
      setStates(data || []);
    } catch (err) {
      setError('Failed to load states');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClusters = async (params = {}) => {
    try {
      setLoading(true);
      const stateId = typeof params === 'string' ? params : params.stateId;
      const districtId = typeof params === 'object' ? params.districtId : null;

      const data = stateId
        ? await locationApi.getClustersHierarchy(stateId)
        : (districtId ? await locationApi.getClusters(districtId) : await locationApi.getClustersHierarchy());

      setClusters(data || []);
    } catch (err) {
      setError('Failed to load clusters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (params = {}) => {
    try {
      setLoading(true);
      const clusterId = typeof params === 'string' ? params : params.clusterId;
      const data = clusterId
        ? await locationApi.getDistrictsHierarchy(clusterId)
        : await locationApi.getDistricts(params);

      setDistricts(data || []);

      if (data && data.length === 1 && clusterId === selectedCluster) {
        setSelectedDistrict(data[0]._id);
      }
    } catch (err) {
      setError('Failed to load districts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (params = {}) => {
    try {
      setLoading(true);
      const districtId = typeof params === 'string' ? params : params.districtId;
      const data = districtId
        ? await locationApi.getCitiesHierarchy(districtId)
        : await locationApi.getCities(districtId); // locationApi.getCities takes stateId or districtId? actually it takes stateId in some cases but let's check locationApi

      setCities(data || []);

      if (data && data.length === 1 && districtId === selectedDistrict) {
        setSelectedCity(data[0]._id);
      }
    } catch (err) {
      setError('Failed to load cities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    countries,
    states,
    clusters,
    districts,
    cities,
    selectedState,
    setSelectedState,
    selectedCluster,
    setSelectedCluster,
    selectedDistrict,
    setSelectedDistrict,
    selectedCity,
    setSelectedCity,
    loading,
    error,
    fetchCountries,
    fetchStates,
    fetchClusters,
    fetchDistricts,
    fetchCities,
    refreshStates: fetchStates
  };
};
