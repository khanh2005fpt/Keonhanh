import axios from 'axios';

const API = 'http://10.0.2.2:9999/api/teams';

// GET
export const getTeams = () => {
  return axios.get(API);
};

// CREATE
export const createTeam = (data) => {
  return axios.post(API, data);
};

// DELETE
export const deleteTeam = async (id) => {
  console.log('DELETE API:', `${API}/${id}`);

  return axios.delete(`${API}/${id}`);
};

// UPDATE
export const updateTeam = (id, data) => {
  return axios.put(`${API}/${id}`, data);
};