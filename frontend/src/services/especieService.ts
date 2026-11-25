import api from './api';
import { ApiResponse, Especie, EspecieDetalhe, EspecieInput } from '../types';

export const especieService = {
    listar: () =>
        api.get<ApiResponse<Especie[]>>('/api/especies'),

    buscar: (id: number) =>
        api.get<ApiResponse<EspecieDetalhe>>(`/api/especies/${id}`),

    criar: (dados: EspecieInput) =>
        api.post<ApiResponse<EspecieDetalhe>>('/api/especies', dados),

    atualizar: (id: number, dados: EspecieInput) =>
        api.put<ApiResponse<EspecieDetalhe>>(`/api/especies/${id}`, dados),

    /** Exclui, ou apenas desativa quando há semeaduras registradas (RF15). */
    excluir: (id: number) =>
        api.delete<ApiResponse<{ resultado: 'excluida' | 'desativada' }>>(`/api/especies/${id}`),
};
