<?php

namespace App\Mail;

use App\Models\FeedbackSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FeedbackAcknowledgementMailable extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public FeedbackSubmission $submission)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ваше обращение принято — '.config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.feedback-acknowledgement',
        );
    }
}
