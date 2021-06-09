<?php declare(strict_types=1);

namespace App\Service;

use App\Security\User;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class Api
{
    private HttpClientInterface $client;

    public function __construct(HttpClientInterface $client, ParameterBagInterface $params)
    {
        $this->client = $client;
        $this->url = $params->get('api.url');
    }

    public function login(User $user)
    {
        $response = $this->client->request(
            'POST',
            $this->url . '/auth/login', [
                'json' => [
                    'email' => $user->getUsername(),
                    'password' => $user->getPassword(),
                ]
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
                ]
            ]
        );
        $content = $response->getContent();

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
        $content = $response->getContent();

        return json_decode($content, true);
    }
}
