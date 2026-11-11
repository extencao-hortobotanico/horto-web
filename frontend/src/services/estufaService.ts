import api from './api';
import { ApiResponse, Estufa, EstufaInput } from '../types';

export const estufaService = {
    listar: () =>
        api.get<ApiResponse<Estufa[]>>('/api/estufas'),

    buscar: (id: number) =>
        api.get<ApiResponse<Estufa>>(`/api/estufas/${id}`),

    criar: (dados: EstufaInput) =>
        api.post<ApiResponse<Estufa>>('/api/estufas', dados),

    atualizar: (id: number, dados: EstufaInput) =>
        api.put<ApiResponse<Estufa>>(`/api/estufas/${id}`, dados),

    excluir: (id: number) =>
        api.delete<ApiResponse<void>>(`/api/estufas/${id}`),
};
