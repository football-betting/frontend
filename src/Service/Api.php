<?php declare(strict_types=1);

namespace App\Service;

use App\Security\User;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class Api
{
    private string $url;

    private HttpClientInterface $client;

    public function __construct(HttpClientInterface $client, ParameterBagInterface $params)
    {
        $this->client = $client;
        $this->url = rtrim($params->get('api.url'),  '/');
    }

    public function login(User $user)
    {
        $response = $this->client->request(
            'POST',
            $this->url . '/auth/login', [
                'json' => [
                    'email' => $user->getUsername(),
                    'password' => $user->getPassword(),
                ],
            ]
        );
        $content = $response->getContent();

        return json_decode($content, true);
    }

    public function register(User $user)
    {
        $response = $this->client->request(
            'POST',
            $this->url . '/auth/register', [
                'json' => [
                    'email' => $user->getEmail(),
                    'username' => $user->getUsername(),
                    'password' => $user->getPassword(),
                    'passwordConfirm' => $user->getPasswordConfirm(),
                    'tip1' => $user->getTip1(),
                    'tip2' => $user->getTip2(),
                ],
            ]
        );
        $content = $response->getContent();

        return json_decode($content, true);
    }

    public function userTips(string $token, string $username)
    {
        $response = $this->client->request(
            'GET',
            $this->url . '/api/user_tip/past/' . $username, [
                'headers' => [
                    'Authorization' => $token,
                    'CONTENT_TYPE' => 'application/json',
                ],
            ]
        );
        $content = $response->getContent(false);

        return json_decode($content, true);
    }


    public function tipsGameInfo(string $token, string $matchId)
    {
        $response = $this->client->request(
            'GET',
            $this->url . '/api/game_tip/past/' . $matchId, [
                'headers' => [
                    'Authorization' => $token,
                    'CONTENT_TYPE' => 'application/json',
                ],
            ]
        );
        $content = $response->getContent(false);

        return json_decode($content, true);
    }

    public function user(string $token)
    {
        $response = $this->client->request(
            'GET',
            $this->url . '/api/user_tip/future', [
                'headers' => [
                    'Authorization' => $token,
                    'CONTENT_TYPE' => 'application/json',
                ],
            ]
        );
        $content = $response->getContent(false);

        return json_decode($content, true);
    }

    public function table(string $token)
    {
        $response = $this->client->request(
            'GET',
            $this->url . '/api/rating', [
                'headers' => [
                    'Authorization' => $token,
                    'CONTENT_TYPE' => 'application/json',
                ],
            ]
        );
        $content = $response->getContent(false);

        return json_decode($content, true);
    }

    public function tips(string $token, array $tips)
    {
        $response = $this->client->request(
            'POST',
            $this->url . '/api/tip/send', [
                'headers' => [
                    'Authorization' => $token,
                    'CONTENT_TYPE' => 'application/json',
                ],
                'json' => $tips
            ]
        );
        $content = $response->getContent(false);

        return json_decode($content, true);
    }

    public function userInfo(string $token)
    {
        $response = $this->client->request(
            'GET',
            $this->url . '/api/user/info', [
                'headers' => [
                    'Authorization' => $token,
                    'CONTENT_TYPE' => 'application/json',
                ],
            ]
        );
        $content = $response->getContent(false);

        return json_decode($content, true);
    }

    public function dailyWinners(string $token)
    {
        $response = $this->client->request(
            'GET',
            $this->url . '/api/daily-winners', [
                'headers' => [
                    'Authorization' => $token,
                    'CONTENT_TYPE' => 'application/json',
                ],
            ]
        );
        $content = $response->getContent(false);

        return json_decode($content, true);
    }
}
