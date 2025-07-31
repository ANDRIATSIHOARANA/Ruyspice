import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../services/api';
import Toast from '../../components/common/Toast';
import './ProfessionalPublicProfile.css';

const ProfessionalPublicProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const [professional, setProfessional] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [motif, setMotif] = useState('');
    const [showMotifModal, setShowMotifModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    const fetchAvailability = useCallback(async () => {
        try {
            const response = await userService.getAvailableSlots(id);
            const slots = Array.isArray(response.data.data) ? response.data.data : [];
            const grouped = slots.reduce((acc, slot) => {
                const date = new Date(slot.debut).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                if (!acc[date]) acc[date] = [];
                acc[date].push(slot);
                return acc;
            }, {});
            setAvailability(grouped);
            setLoading(false);
        } catch (err) {
            console.error('Erreur lors du chargement des disponibilités:', err);
            setError('Impossible de charger les disponibilités');
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                if (!id) throw new Error('ID du professionnel manquant');
                
                const [profData] = await Promise.all([
                    userService.getProfessional(id),
                    fetchAvailability()
                ]);

                if (!profData?.data) throw new Error('Données du profil invalides');
                setProfessional(profData.data);
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };

        id && loadData();
    }, [id, fetchAvailability]);

    const handleSlotClick = (slot) => {
        if (!auth?.isAuthenticated) {
            setToastMessage('Veuillez vous connecter pour prendre rendez-vous');
            setShowToast(true);
            setTimeout(() => navigate('/login'), 2000);
            return;
        }
        setSelectedSlot(slot);
        setShowMotifModal(true);
    };

    const openPhotoModal = () => {
        setShowPhotoModal(true);
    };

    const closePhotoModal = () => {
        setShowPhotoModal(false);
    };

    const handleConfirmBooking = async () => {
        try {
            setLoading(true);
            const appointmentData = {
                professionnelId: id,
                date: selectedSlot.debut,
                status: 'pending',
                motif: motif.trim()
            };
            
            await userService.bookAppointment(appointmentData);
            setToastMessage('Rendez-vous réservé avec succès!');
            setShowToast(true);
            setTimeout(() => navigate('/user/appointments'), 2000);
            setMotif('');
        } catch (err) {
            setToastMessage(err.response?.data?.message || 'Erreur lors de la réservation');
            setShowToast(true);
        } finally {
            setLoading(false);
            setShowMotifModal(false);
        }
    };

    if (loading) return <div className="loading-spinner">Chargement...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!professional) return <div className="error-message">Profil non trouvé</div>;

    return (
        <div className="professional-public-profile">
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastMessage.includes('succès') ? 'success' : 'error'}
                    duration={3000}
                    onClose={() => setShowToast(false)}
                />
            )}

            {showMotifModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Motif de la consultation</h3>
                        <textarea
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            placeholder="Décrivez la raison de votre consultation..."
                            required
                        />
                        <div className="modal-actions">
                            <button 
                                onClick={() => setShowMotifModal(false)}
                                className="btn-secondary"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleConfirmBooking}
                                className="btn-primary"
                                disabled={!motif.trim()}
                            >
                                Confirmer la réservation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="profile-header">
                <div className="profile-photo-container" onClick={openPhotoModal}>
                    <img
                        src={professional.photo || '/default-avatar.png'}
                        alt={`${professional.nom} ${professional.prenom}`}
                        className="profile-photo"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-avatar.png';
                        }}
                    />
                    <div className="photo-overlay">
                        <span>Agrandir</span>
                    </div>
                </div>
                <h1>{professional.nom} {professional.prenom}</h1>
                <p>{professional.email}</p>
            </div>

            {/* Modal pour afficher la photo en grand */}
            {showPhotoModal && (
                <div className="photo-modal" onClick={closePhotoModal}>
                    <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
                        <span className="close-modal" onClick={closePhotoModal}>&times;</span>
                        <img 
                            src={professional.photo || '/default-avatar.png'} 
                            alt={`${professional.nom} ${professional.prenom}`} 
                            className="modal-photo"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-avatar.png';
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="availability-section">
                <h2>Disponibilités</h2>
                {Object.keys(availability).length === 0 ? (
                    <p>Aucune disponibilité pour le moment</p>
                ) : (
                    Object.entries(availability).map(([date, slots]) => (
                        <div key={date} className="date-group">
                            <h3 className="date-header">{date}</h3>
                            <div className="time-slots">
                                {slots.map((slot) => (
                                    <button
                                        key={slot._id}
                                        className="time-slot"
                                        onClick={() => handleSlotClick(slot)}
                                    >
                                        <span role="img" aria-label="clock">🕒</span>
                                        {new Date(slot.debut).toLocaleTimeString('fr-FR', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })} - 
                                        {new Date(slot.fin).toLocaleTimeString('fr-FR', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProfessionalPublicProfile;
