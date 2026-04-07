<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackSubmission extends Model
{
    public const DELIVERY_PENDING = 'pending';

    /** Письмо-подтверждение успешно отправлено (косвенный признак достижимости ящика). */
    public const DELIVERY_DELIVERED = 'delivered';

    /** Не удалось отправить письмо (недостижимый ящик, SMTP и т.п.). */
    public const DELIVERY_FAILED = 'failed';

    protected $fillable = [
        'email',
        'name',
        'message',
        'delivery_status',
    ];
}
