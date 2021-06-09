<?php

namespace App\Controller;


use App\Service\Api;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractController
{
    private Api $api;

    /**
     * @param \App\Service\Api $api
     */
    public function __construct(Api $api)
    {
        $this->api = $api;
    }

    /**
     * @Route("/home", name="home")
     */
    public function home(Request $request): Response
    {
        $token = $request->getSession()->get('token');

        $data = $this->api->user($token);
        $games = $data['data']['tips'];
        return $this->render('home/index.html.twig' ,[
            'games' => $games
        ]);
    }

    /**
     * @Route("/test", name="test")
     */
    public function test(Request $request): Response
    {
        $json = json_encode(['success' => true]);

        return new Response($json);
    }
}
