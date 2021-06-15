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

        $table = $this->api->table($token);
//        dump($table);
        return $this->render('home/index.html.twig' ,[
            'games' => $games
        ]);
    }


    /**
     * @Route("/table", name="table")
     */
    public function table(Request $request): Response
    {
        return $this->render('home/table.html.twig' ,[

        ]);
    }

    /**
     * @Route("/test", name="test")
     */
    public function test(Request $request): Response
    {
        $token = $request->getSession()->get('token');
        $conetnt = json_decode($request->getContent(), true);

        $conetnt['tipTeam1'] = (int)$conetnt['tipTeam1'];
        $conetnt['tipTeam2'] = (int)$conetnt['tipTeam2'];

        $data = $this->api->tips($token, $conetnt);
        $json = json_encode($data);

        return new Response($json);
    }
}
