"use client";

import { useState, useEffect } from "react";
import { Star, MessageCircle, Send, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  name: string;
  tripRoute: string | null;
  createdAt: string;
}

interface ReviewsSectionProps {
  driverId: string;
  driverName: string;
  initialRating: number;
  initialCount: number;
}

export default function ReviewsSection({
  driverId,
  driverName,
  initialRating,
  initialCount,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [avgRating, setAvgRating] = useState(initialRating);
  const [totalReviews, setTotalReviews] = useState(initialCount);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [tripRoute, setTripRoute] = useState("");

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?driverId=${driverId}&limit=20`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews);
          setAvgRating(data.avgRating);
          setTotalReviews(data.total);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [driverId]);

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          rating,
          comment: comment || null,
          name: name || null,
          tripRoute: tripRoute || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setReviews([data.review, ...reviews]);
        setTotalReviews(totalReviews + 1);
        // Reset form
        setComment("");
        setName("");
        setTripRoute("");
        setRating(5);
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.error || "Error al enviar la reseña");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Render stars
  const renderStars = (value: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`${interactive ? "cursor-pointer" : "cursor-default"}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (interactive ? (hoverRating || rating) : value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <>
      {/* Reviews Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-yellow-400" />
              Reseñas
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
            >
              <Star className="mr-1 h-4 w-4" />
              Dejar reseña
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rating summary */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400">
                {avgRating.toFixed(1)}
              </div>
              <div className="flex justify-center mt-1">
                {renderStars(Math.round(avgRating))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"}
              </div>
            </div>
            <div className="flex-1">
              {/* Rating bars */}
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter((r) => r.rating === stars).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-muted-foreground text-xs">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews list */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400 mx-auto" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aún no hay reseñas</p>
              <p className="text-sm">¡Sé el primero en dejar una!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {displayedReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg border border-border bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.name}</span>
                          {renderStars(review.rating)}
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground text-sm mb-2">
                            "{review.comment}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {review.tripRoute && (
                            <Badge variant="outline" className="text-xs">
                              {review.tripRoute}
                            </Badge>
                          )}
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Show more/less button */}
              {reviews.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="mr-1 h-4 w-4" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-4 w-4" />
                      Ver las {reviews.length - 3} reseñas más
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Star className="h-8 w-8 text-green-500 fill-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">¡Gracias!</h3>
                  <p className="text-muted-foreground">
                    Tu reseña ha sido enviada correctamente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Dejar una reseña</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowModal(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <p className="text-muted-foreground mb-4">
                    Valora tu experiencia con <strong>{driverName}</strong>
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Rating stars */}
                    <div>
                      <Label className="mb-2 block">Tu valoración *</Label>
                      <div className="flex items-center gap-2">
                        {renderStars(rating, true)}
                        <span className="text-sm text-muted-foreground ml-2">
                          {rating === 5 ? "Excelente" : rating === 4 ? "Muy bueno" : rating === 3 ? "Bueno" : rating === 2 ? "Regular" : "Malo"}
                        </span>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <Label htmlFor="review-name">Tu nombre (opcional)</Label>
                      <Input
                        id="review-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Cliente anónimo"
                        className="mt-1.5"
                      />
                    </div>

                    {/* Trip route */}
                    <div>
                      <Label htmlFor="review-route">Ruta del viaje (opcional)</Label>
                      <Input
                        id="review-route"
                        value={tripRoute}
                        onChange={(e) => setTripRoute(e.target.value)}
                        placeholder="Ej: Zúrich → Aeropuerto"
                        className="mt-1.5"
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <Label htmlFor="review-comment">Tu comentario (opcional)</Label>
                      <Textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="¿Cómo fue tu experiencia?"
                        className="mt-1.5 min-h-[100px]"
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {comment.length}/500 caracteres
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <Button
                      type="submit"
                      className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar reseña
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
